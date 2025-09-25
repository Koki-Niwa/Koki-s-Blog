import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Tech Sharing',
    Img: require('@site/static/img/Page1.png').default,
    description: (
      <>
This site is dedicated to sharing technical knowledge. From coding practices to system-level thinking, 
it provides clear explanations and hands-on insights for learners and enthusiasts.
      </>
    ),
  },
  {
    title: 'Computer Architecture',
    Img: require('@site/static/img/page2.png').default,
    description: (
      <>
The core focus is on computer architecture. 
Here, I explore processors, instruction sets, memory systems, and the underlying principles that drive modern computing.
      </>
    ),
  },
  {   
    title: 'Personal Growth',
    Img: require('@site/static/img/page3.png').default,
    description: (
      <>
At the same time, it is also my personal growth journal. 
Recording challenges, breakthroughs, and reflections, it captures my journey of continuous learning and improvement.
      </>
    ),
  },
];

function Feature({Img, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={Img} alt={title} className={styles.featureImg} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}
export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
